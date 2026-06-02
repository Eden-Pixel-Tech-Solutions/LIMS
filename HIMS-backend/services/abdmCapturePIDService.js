import axios from "axios";
import { getAbdmHeaders } from "../utils/abdmHeaders.js";

export const checkCapturePID = async (accessToken, txnId) => {
  try {
    const response = await axios.post(
      "https://abhasbx.abdm.gov.in/abha/api/v3/enrollment/enrol/capturePID",
      {
        scope: ["abha-enrol", "face-verify"],
        txnId
      },
      { headers: getAbdmHeaders(accessToken) }
    );
    return response.data;
  } catch (error) {
    console.error("CapturePID Error:", error.response?.data || error.message);
    throw error;
  }
};
