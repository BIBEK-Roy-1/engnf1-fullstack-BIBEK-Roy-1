
import { registerUser, loginUser } from "../services/auth.service.js";

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const user = await registerUser({ name, email, password });

    return res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await loginUser({ email, password });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
