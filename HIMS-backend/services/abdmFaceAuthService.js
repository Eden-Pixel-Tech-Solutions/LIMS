import axios from "axios";
import { getAbdmHeaders } from "../utils/abdmHeaders.js";

export const enrolByFaceAuth = async (accessToken, txnId, encryptedAadhaar, faceImage, mobile) => {
  try {
    const response = await axios.post(
      "https://abhasbx.abdm.gov.in/abha/api/v3/enrollment/enrol/byAadhaar",
      {
        authData: {
          authMethods: ["face_auth"],
          face: {
            txnId,
            aadhaar: encryptedAadhaar,
            mobile
          }
        },
        consent: {
          code: "abha-enrollment",
          version: "1.4"
        }
      },
      { headers: getAbdmHeaders(accessToken) }
    );
    return response.data;
  } catch (error) {
    console.error("ABHA Face Auth Enrolment Error:", error.response?.data || error.message);
    throw error;
  }
};
