import DatabaseInserter from './database';
import CsvInserter from './csv';

export default (container) => {
  const { L } = container.defaultLogger('Picker Process');

  const databaseInserter = DatabaseInserter(container);
  const csvInserter = CsvInserter(container);

  const wait = duration => new Promise(resolve => setTimeout(resolve, duration));

  const mapRecord = (csvRecord, metadata) => {
    const { mediaType = 'none', columns } = metadata;
    const record = {
      cmpParameters: [],
    };

    if (mediaType !== 'none') {
      record.cmpMedia = {
        mediaType,
      };
    }

    // Load Columns
    for (let i = 1; i < csvRecord.length; i += 1) {
      const column = columns[i];
      const data = csvRecord[i];

      if (column === 'parameter') {
        if (data && data !== '') {
          record.cmpParameters.push(data);
        }
      } else if (column === 'recipient') {
        record.recipient = data;
      } else {
        record.cmpMedia[column] = data;
      }
    }

    return record;
  };

  const processFileContent = async (
    jsonContent, cmpCampaignId, cmpTemplateId, campaign,
    metadata,
  ) => {
    try {
      const { insertMode } = container.config.csv;
      const processStart = new Date().getTime();

      // Mapping
      const mappingStart = new Date().getTime();
      L.trace(`Campaign ID: ${cmpCampaignId}`);
      L.trace(`Template ID: ${cmpTemplateId}`);
      const {
        activeStartHour, activeStartMinute,
        activeEndHour, activeEndMinute,
        activeOnWeekends, timezone,
      } = campaign;
      const recordModels = jsonContent
        .map(item => mapRecord(item, metadata))
        .map(record => ({
          recipient: record.recipient,
          cmpCampaignId,
          cmpTemplateId,
          cmpMediaId: null,
          cmpMedia: record.cmpMedia,
          cmpParameters: record.cmpParameters,
          activeStartHour,
          activeStartMinute,
          activeEndHour,
          activeEndMinute,
          activeOnWeekends,
          timezone,
        }));
      const mappingEnd = new Date().getTime();
      L.debug(`Time Taken (Process File Content - Mapping): ${mappingEnd - mappingStart}ms`);

      // Insert
      const insertStart = new Date().getTime();
      if (insertMode === 'csv') {
        L.trace('Inserting using CSV (DataLoad)');
        await csvInserter.createRecordsCsv(recordModels);
      } else {
        L.trace('Inserting using Database (Bulk Insert SQL)');
        await databaseInserter.createRecordsDatabase(recordModels);
      }
      const insertEnd = new Date().getTime();
      L.debug(`Time Taken (Process File Content - Insert): ${insertEnd - insertStart}ms`);

      const processEnd = new Date().getTime();
      L.debug(`Time Taken (Process File Content - Total): ${processEnd - processStart}ms`);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const parseContentBatch = (batchContent) => {
    const processStart = new Date().getTime();
    const result = [];
    const csvData = container.csvService.fromCsvSync(batchContent);
    for (let i = 0; i < csvData.length; i += 1) {
      const csvItem = csvData[i];
      result.push(csvItem);
    }
    const processEnd = new Date().getTime();
    L.debug(`Time Taken (Parse Content Batch): ${processEnd - processStart}ms`);
    return result;
  };

  const getMetadata = async (cmpCampaignId, cmpTemplateId) => {
    try {
      const { uploadPath } = container.config.csv;
      const fileName = `${cmpCampaignId}_${cmpTemplateId}.metadata`;
      const filePath = `${uploadPath}/${fileName}`;
      const metadataContent = await container.fileService.readContent(filePath);
      const metadata = JSON.parse(metadataContent);
      return Promise.resolve(metadata);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const processContentBatch = async (
    batchContent, cmpCampaignId, cmpTemplateId, campaign,
  ) => {
    try {
      const processStart = new Date().getTime();
      const metadata = await getMetadata(cmpCampaignId, cmpTemplateId);
      const result = parseContentBatch(batchContent);
      await processFileContent(result, cmpCampaignId, cmpTemplateId, campaign, metadata);

      const processEnd = new Date().getTime();
      L.debug(`Time Taken (Process Content Batch): ${processEnd - processStart}ms`);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const processNextBatch = async (
    fileReader,
    cmpCampaignId,
    cmpTemplateId,
    campaign,
    options = { skipCount: 0, batchSize: 1000 },
    tracker = { startTime: 0, batchNumber: 0 },
  ) => {
    try {
      let count = 0;
      let content = '';

      let line = fileReader.next();
      while (line) {
        if (count >= options.skipCount) {
          content += `${line}\n`;
        }
        count += 1;

        if (count % options.batchSize === 0) {
          break;
        }

        line = fileReader.next();
      }
      const endTime = new Date().getTime();
      L.debug(`Time Taken (Process Next Batch): [${tracker.batchNumber}][${count}] ${endTime - tracker.startTime}ms`);

      await processContentBatch(content, cmpCampaignId, cmpTemplateId, campaign);
      if (line) {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            const newOptions = {
              skipCount: 0,
              batchSize: options.batchSize,
            };
            const newTracker = {
              startTime: new Date().getTime(),
              batchNumber: tracker.batchNumber + 1,
            };
            processNextBatch(
              fileReader, cmpCampaignId, cmpTemplateId, campaign, newOptions, newTracker,
            )
              .then(resolve)
              .catch(reject);
          }, 0);
        });
      }
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const processFileBatch = async (fileName) => {
    try {
      const { skipCount, batchSize } = container.config.csv;
      const processStart = new Date().getTime();
      const metadata = extractMetadataFromFileName(fileName);
      const { cmpCampaignId, cmpTemplateId } = metadata;
      const { CmpCampaign } = container.persistenceService;
      const campaign = await CmpCampaign.readCampaign(cmpCampaignId);
      const { uploadPath } = container.config.csv;
      const filePath = `${uploadPath}/${fileName}`;
      const fileReader = container.fileService.readNLineBuffer(filePath);
      const options = { skipCount, batchSize };
      const tracker = {
        startTime: new Date().getTime(),
        batchNumber: 1,
      };
      await processNextBatch(fileReader, cmpCampaignId, cmpTemplateId, campaign, options, tracker);

      const processEnd = new Date().getTime();
      L.debug(`Time Taken (Process File): ${processEnd - processStart}ms`);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const extractMetadataFromFileName = (fileName) => {
    const extractStart = new Date().getTime();
    const fileNameComponents = fileName.split(/_/g);
    const metadata = {
      timestamp: fileNameComponents[0],
      cmpCampaignId: fileNameComponents[1],
      cmpTemplateId: fileNameComponents[2],
      originalFileName: fileNameComponents[3],
    };
    const extractEnd = new Date().getTime();
    L.debug(`Time Taken (Extract Metadata): ${extractEnd - extractStart}ms`);
    return metadata;
  };

  const archiveFile = async (fileName) => {
    try {
      const { uploadPath, archivePath } = container.config.csv;
      const oldPath = `${uploadPath}/${fileName}`;
      const newPath = `${archivePath}/${fileName}`;

      const archiveStart = new Date().getTime();
      container.fs.renameSync(oldPath, newPath);
      const archiveEnd = new Date().getTime();
      L.debug(`Time Taken (Archive): ${archiveEnd - archiveStart}ms`);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const runSingle = async () => {
    try {
      const { uploadPath } = container.config.csv;
      const { parallelPick } = container.config.picker;
      const uploadDirectoryFileNames = container.fs.readdirSync(uploadPath);
      const csvFilter = name => name !== '' && name.toLowerCase().indexOf('.csv') === name.length - 4;
      const csvFiles = uploadDirectoryFileNames.filter(csvFilter);

      let numFilesPicked = 0;
      if (parallelPick) {
        // Parallel
        const promises = csvFiles.map(async (csvFile) => {
          try {
            // Process
            await processFileBatch(csvFile);

            // Archive
            await archiveFile(csvFile);
            return Promise.resolve();
          } catch (error) {
            return Promise.reject(error);
          }
        });
        const result = await Promise.all(promises);
        numFilesPicked = result.length;
      } else if (csvFiles.length > 0) {
        // Single File
        const csvFile = csvFiles[0];

        // Process
        await processFileBatch(csvFile);

        // Archive
        await archiveFile(csvFile);
      }

      L.info(`${numFilesPicked} files processed`);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const runIndefinitely = async (pickTime) => {
    try {
      // Wait
      const currentTime = new Date().getTime();
      const waitTime = pickTime - currentTime;
      if (waitTime > 0) {
        const waitStart = new Date().getTime();
        await wait(waitTime);
        const waitEnd = new Date().getTime();
        L.debug(`Time Taken (Wait): ${waitEnd - waitStart}ms`);
      }

      L.trace('Wait Over');

      const startTime = new Date().getTime();
      await runSingle();
      const endTime = new Date().getTime();
      L.debug(`Time Taken (Iteration): ${endTime - startTime}ms`);

      const nextPickTime = endTime + (container.config.picker.delay * 1000);
      return runIndefinitely(nextPickTime);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const run = async () => {
    try {
      // Check if Process Active Hour is OK
      const startTime = new Date();
      L.info(`Picker Process started at ${startTime}`);

      await runIndefinitely(new Date().getTime(), 0);

      const endTime = new Date();
      L.info(`Picker Process ended at ${endTime}`);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  return {
    run,
  };
};
