import { getResources, getResourceById,createResource,updateResource,getResourceAvailability,
 } from "../services/resource.service.js";

export const getResourcesController = async (req, res, next) => {
  try {
    const result = await getResources(req.query, req.user);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getResourceByIdController = async (req, res, next) => {
  try {
    const resource = await getResourceById(req.params.id, req.user);

    return res.status(200).json(resource);
  } catch (error) {
    next(error);
  }
};

export const createResourceController = async (req, res, next) => {
  try {
    const resource = await createResource(req.body);

    return res.status(201).json(resource);
  } catch (error) {
    next(error);
  }
};

export const updateResourceController = async (req, res, next) => {
  try {
    const resource = await updateResource(req.params.id, req.body);

    return res.status(200).json(resource);
  } catch (error) {
    next(error);
  }
};

export const getResourceAvailabilityController = async (req, res, next) => {
  try {
    const result = await getResourceAvailability(
      req.params.id,
      req.query,
      req.user,
    );

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
