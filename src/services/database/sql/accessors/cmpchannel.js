export default (container) => {
  const { L } = container.defaultLogger('Cmp Channel Model Accessor');

  const getByIdUser = async (cmpChannelId, userId, excludeSecret = true, excludeDeleted = true) => {
    try {
      const {
        CmpApplication, CmpApiKey, CmpChannel, User, UserChannel,
      } = container.databaseService.models;
      const query = {
        where: {
          id: cmpChannelId,
        },
        include: [
          {
            model: CmpApplication,
            as: 'cmpApplication',
            foreignKey: 'cmpApplicationId',
            where: {
              deleted: false,
            },
            required: false,
          },
          {
            model: CmpApiKey,
            as: 'cmpApiKey',
            foreignKey: 'cmpApiKeyId',
            where: {
              deleted: false,
            },
            required: false,
          },
          {
            model: User,
            through: {
              model: UserChannel,
              where: {
                deleted: false,
              },
              required: true,
            },
            foreignKey: 'cmpChannelId',
            as: 'users',
            where: {
              id: userId,
              deleted: false,
            },
            required: true,
          },
        ],
      };

      // Check Deleted
      if (excludeDeleted) {
        query.where.deleted = false;
      }

      const rawCmpChannel = await CmpChannel.findOne(query);
      if (rawCmpChannel == null) {
        L.debug('Null result for Get By Id, returning null');
        return Promise.resolve(null);
      }

      const cmpChannel = mapCmpChannel(rawCmpChannel, excludeSecret);
      return Promise.resolve(cmpChannel);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const getByIdAdmin = async (cmpChannelId, excludeSecret = true, excludeDeleted = true) => {
    try {
      const {
        CmpApplication, CmpApiKey, CmpChannel, User, UserChannel,
      } = container.databaseService.models;
      const query = {
        where: {
          id: cmpChannelId,
        },
        include: [
          {
            model: CmpApplication,
            as: 'cmpApplication',
            foreignKey: 'cmpApplicationId',
            where: {
              deleted: false,
            },
            required: false,
          },
          {
            model: CmpApiKey,
            as: 'cmpApiKey',
            foreignKey: 'cmpApiKeyId',
            where: {
              deleted: false,
            },
            required: false,
          },
          {
            model: User,
            through: {
              model: UserChannel,
              where: {
                deleted: false,
              },
              required: false,
            },
            foreignKey: 'cmpChannelId',
            as: 'users',
            where: {
              deleted: false,
            },
            required: false,
          },
        ],
      };

      // Check Deleted
      if (excludeDeleted) {
        query.where.deleted = false;
      }

      const rawCmpChannel = await CmpChannel.findOne(query);
      if (rawCmpChannel == null) {
        L.debug('Null result for Get By Id, returning null');
        return Promise.resolve(null);
      }

      const cmpChannel = mapCmpChannel(rawCmpChannel, excludeSecret);
      return Promise.resolve(cmpChannel);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const getByCriteriaUser = async (
    criteria = {}, userId, excludeSecret = true, excludeDeleted = true,
  ) => {
    try {
      const {
        CmpApiKey, CmpApplication, CmpChannel, User, UserChannel,
      } = container.databaseService.models;
      const query = {
        where: criteria,
        include: [
          {
            model: CmpApplication,
            as: 'cmpApplication',
            foreignKey: 'cmpApplicationId',
            where: {
              deleted: false,
            },
            required: false,
          },
          {
            model: CmpApiKey,
            as: 'cmpApiKey',
            foreignKey: 'cmpApiKeyId',
            where: {
              deleted: false,
            },
            required: false,
          },
          {
            model: User,
            through: {
              model: UserChannel,
              where: {
                deleted: false,
              },
              required: true,
            },
            foreignKey: 'cmpChannelId',
            as: 'users',
            where: {
              id: userId,
              deleted: false,
            },
            required: true,
          },
        ],
      };

      // Check Deleted
      if (excludeDeleted) {
        query.where.deleted = false;
      }

      const rawCmpChannels = await CmpChannel.findAll(query);
      const cmpChannels = rawCmpChannels
        .map(cmpChannel => mapCmpChannel(cmpChannel, excludeSecret));
      return Promise.resolve(cmpChannels);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const getByCriteriaAdmin = async (criteria = {}, excludeSecret = true, excludeDeleted = true) => {
    try {
      const {
        CmpApiKey, CmpApplication, CmpChannel, User, UserChannel,
      } = container.databaseService.models;
      const query = {
        where: criteria,
        include: [
          {
            model: CmpApplication,
            as: 'cmpApplication',
            foreignKey: 'cmpApplicationId',
            where: {
              deleted: false,
            },
            required: false,
          },
          {
            model: CmpApiKey,
            as: 'cmpApiKey',
            foreignKey: 'cmpApiKeyId',
            where: {
              deleted: false,
            },
            required: false,
          },
          {
            model: User,
            through: {
              model: UserChannel,
              where: {
                deleted: false,
              },
              required: false,
            },
            foreignKey: 'cmpChannelId',
            as: 'users',
            where: {
              deleted: false,
            },
            required: false,
          },
        ],
      };

      // Check Deleted
      if (excludeDeleted) {
        query.where.deleted = false;
      }

      const rawCmpChannels = await CmpChannel.findAll(query);
      const cmpChannels = rawCmpChannels
        .map(cmpChannel => mapCmpChannel(cmpChannel, excludeSecret));
      return Promise.resolve(cmpChannels);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const getOneByCriteria = async (
    criteria = {}, userId, excludeSecret = true, excludeDeleted = true,
  ) => {
    try {
      const cmpChannels = userId ? await getByCriteriaUser(
        criteria, userId, excludeSecret, excludeDeleted,
      ) : await getByCriteriaAdmin(criteria, excludeSecret, excludeDeleted);
      if (cmpChannels == null || cmpChannels.length === 0) {
        L.debug('Empty result when trying to Get One by Criteria, returning null');
        return Promise.resolve(null);
      }

      const cmpChannel = cmpChannels[0];
      return Promise.resolve(cmpChannel);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const updateById = async (
    cmpChannelId, userId, changes = {}, excludeSecret = true, excludeDeleted = true,
  ) => {
    try {
      const { CmpChannel } = container.databaseService.models;
      const query = {
        where: {
          id: cmpChannelId,
        },
      };

      // Check Deleted
      if (excludeDeleted) {
        query.where.deleted = false;
      }

      const result = await CmpChannel.update(changes, query);
      L.debug('CmpChannel Update Result', result);

      const cmpChannel = userId ? await getByIdUser(
        cmpChannelId, userId, excludeSecret, excludeDeleted,
      ) : await getByIdAdmin(cmpChannelId, excludeSecret, excludeDeleted);
      return Promise.resolve(cmpChannel);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const updateByCriteria = async (
    criteria = {}, userId, changes = {}, excludeSecret = true, excludeDeleted = true,
  ) => {
    try {
      const { CmpChannel } = container.databaseService.models;
      const query = { where: criteria };

      // Check Deleted
      if (excludeDeleted) {
        query.where.deleted = false;
      }

      const result = await CmpChannel.update(changes, query);
      L.debug('CmpChannel Update Result', result);

      const cmpChannels = userId ? await getByCriteriaUser(
        criteria, userId, excludeSecret, excludeDeleted,
      ) : await getByCriteriaAdmin(criteria, excludeSecret, excludeDeleted);
      return Promise.resolve(cmpChannels);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const mapUser = (user) => {
    const userData = user.dataValues;

    const mappedUser = {
      id: userData.id,
      firstName: userData.firstName,
      lastName: userData.lastName,
    };

    return mappedUser;
  };

  const mapCmpApplication = (cmpApplication, excludeSecret = true) => {
    const mappedCmpApplication = cmpApplication.dataValues;

    if (excludeSecret) {
      delete mappedCmpApplication.privateKey;
    }

    delete mappedCmpApplication.deleted;
    delete mappedCmpApplication.createdAt;
    delete mappedCmpApplication.updatedAt;

    return mappedCmpApplication;
  };

  const mapCmpApiKey = (cmpApiKey, excludeSecret = true) => {
    const mappedCmpApiKey = cmpApiKey.dataValues;

    if (excludeSecret) {
      delete mappedCmpApiKey.apiSecret;
    }

    delete mappedCmpApiKey.deleted;
    delete mappedCmpApiKey.createdAt;
    delete mappedCmpApiKey.updatedAt;

    return mappedCmpApiKey;
  };

  const mapCmpChannel = (cmpChannel, excludeSecret = true) => {
    const mappedCmpChannel = cmpChannel.dataValues;

    if (mappedCmpChannel.cmpApiKey) {
      mappedCmpChannel.cmpApiKey = mapCmpApiKey(
        mappedCmpChannel.cmpApiKey, excludeSecret,
      );
    }

    if (mappedCmpChannel.cmpApplication) {
      mappedCmpChannel.cmpApplication = mapCmpApplication(
        mappedCmpChannel.cmpApplication, excludeSecret,
      );
    }

    mappedCmpChannel.users = (mappedCmpChannel.users || [])
      .map(mapUser);

    delete mappedCmpChannel.deleted;
    delete mappedCmpChannel.createdAt;
    delete mappedCmpChannel.updatedAt;

    return mappedCmpChannel;
  };

  const listChannels = async (userId, excludeSecret = true) => {
    try {
      const cmpChannels = userId ? await getByCriteriaUser(
        {}, userId, excludeSecret, true,
      ) : await getByCriteriaAdmin({}, excludeSecret, true);
      return Promise.resolve(cmpChannels);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const createChannel = async (
    name,
    channel,
    senderId,
    tps,
    cmpApplicationId,
    cmpApiKeyId,
    excludeSecret = true,
  ) => {
    try {
      const { CmpChannel } = container.databaseService.models;
      const rawCmpChannel = await CmpChannel.create({
        id: container.uuid(),
        name,
        channel,
        senderId,
        tps,
        cmpApplicationId,
        cmpApiKeyId,
        deleted: false,
      });

      const cmpChannel = mapCmpChannel(rawCmpChannel, excludeSecret);
      return Promise.resolve(cmpChannel);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const readChannel = async (cmpChannelId, userId, excludeSecret = true) => {
    try {
      const cmpChannel = userId ? await getByIdUser(
        cmpChannelId, userId, excludeSecret, false,
      ) : await getByIdAdmin(cmpChannelId, excludeSecret, false);
      return Promise.resolve(cmpChannel);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const updateChannel = async (cmpChannelId, userId, changes, excludeSecret = true) => {
    try {
      const cmpChannel = await updateById(cmpChannelId, userId, changes, excludeSecret, true);
      return Promise.resolve(cmpChannel);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const updateChannels = async (criteria, userId, changes, excludeSecret = true) => {
    try {
      const cmpChannels = await updateByCriteria(criteria, userId, changes, excludeSecret, true);
      return Promise.resolve(cmpChannels);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const deleteChannel = async (cmpChannelId, userId, excludeSecret = true) => {
    try {
      const changes = { deleted: true };
      const cmpChannel = await updateById(cmpChannelId, userId, changes, excludeSecret, true);
      return Promise.resolve(cmpChannel);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const deleteChannels = async (criteria = {}, userId, excludeSecret = true) => {
    try {
      const changes = { deleted: true };
      const cmpChannels = await updateByCriteria(criteria, userId, changes, excludeSecret, true);
      return Promise.resolve(cmpChannels);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const findChannel = async (
    criteria = {}, userId, excludeSecret = true, excludeDeleted = true,
  ) => {
    try {
      const cmpChannel = await getOneByCriteria(criteria, userId, excludeSecret, excludeDeleted);
      return Promise.resolve(cmpChannel);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const findChannels = async (
    criteria = {}, userId, excludeSecret = true, excludeDeleted = true,
  ) => {
    try {
      const cmpChannels = userId ? await getByCriteriaUser(
        criteria, userId, excludeSecret, excludeDeleted,
      ) : await getByCriteriaAdmin(criteria, excludeSecret, excludeDeleted);
      return Promise.resolve(cmpChannels);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  return {
    listChannels,

    createChannel,
    readChannel,

    updateChannel,
    updateChannels,

    deleteChannel,
    deleteChannels,

    findChannel,
    findChannels,
  };
};
