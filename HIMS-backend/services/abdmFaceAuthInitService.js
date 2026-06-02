import axios from "axios";
import { getAbdmHeaders } from "../utils/abdmHeaders.js";

export const initFaceAuth = async (accessToken) => {
  try {
    const response = await axios.post(
      "https://abhasbx.abdm.gov.in/abha/api/v3/enrollment/enrol/auth/init",
      {
        scope: ["abha-enrol", "face-auth"]
      },
      { headers: getAbdmHeaders(accessToken) }
    );
    return response.data;
  } catch (error) {
    console.error("Face Auth Init Error:", error.response?.data || error.message);
    throw error;
  }
};
