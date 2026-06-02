import axios from "axios";
import { getAbdmHeaders } from "../utils/abdmHeaders.js";

export const getAbhaSuggestions = async (accessToken, txnId, xToken = null) => {
  try {
    const headers = getAbdmHeaders(accessToken);
    if (xToken) headers['X-Token'] = `Bearer ${xToken}`;

    const response = await axios.post(
      'https://abhasbx.abdm.gov.in/abha/api/v3/enrollment/enrol/suggestion',
      { txnId },
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("Suggestion Error:", error.response?.data || error.message);
    throw error;
  }
};
