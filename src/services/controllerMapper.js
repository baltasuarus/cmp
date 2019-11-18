export default (container) => {
  const { L } = container.defaultLogger('ControllerMapper');

  const getUserRoles = (req) => {
    const { user } = req;
    if (user == null) {
      throw new container.AuthenticationError('Not authenticated');
    }

    const userRoles = user.roles;
    return userRoles;
  };

  const hasRole = (expectedRole, userRoles) => {
    let userHasRole = false;

    for (let i = 0; i < userRoles.length; i += 1) {
      const userRole = userRoles[i];

      if (expectedRole === userRole) {
        userHasRole = true;
        break;
      }
    }

    return userHasRole;
  };

  const hasAllRoles = (expectedRoles, userRoles) => {
    let userHasAllRoles = true;

    if (userRoles == null) {
      L.warn('User Roles is Null');
      return false;
    }

    for (let i = 0; i < expectedRoles.length; i += 1) {
      const expectedRole = expectedRoles[i];
      const userHasRole = hasRole(expectedRole, userRoles);

      if (!userHasRole) {
        userHasAllRoles = false;
        break;
      }
    }

    return userHasAllRoles;
  };

  const map = controllerConfigs => async (req, res, next) => {
    try {
      const userRoles = getUserRoles(req);
      let mappedController;

      if (controllerConfigs == null) {
        L.warn('No Config found, proceeding to next');
        next();
        return;
      }

      for (let i = 0; i < controllerConfigs.length; i += 1) {
        const controllerConfig = controllerConfigs[i];
        L.debug('Checking Controller Config', controllerConfig);
        const { roles, controller } = controllerConfig;
        const userHasAllRoles = hasAllRoles(roles, userRoles);

        if (userHasAllRoles) {
          L.debug('User has All Roles');
          mappedController = controller;
          break;
        }

        L.debug('User does not have All Roles');
      }

      if (mappedController) {
        L.debug('Mapped Controller found, using configured controller');
        L.debug(mappedController);
        mappedController(req, res, next);
      } else {
        L.debug('No Mapped Controller, proceeding to next');
        next();
      }
    } catch (error) {
      next(error);
    }
  };

  return {
    map,
  };
};
