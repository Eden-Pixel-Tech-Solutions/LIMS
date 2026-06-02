import axios from "axios";
import { getAbdmHeaders } from "../utils/abdmHeaders.js";

// Step 1 (mobile flow): Search ABHA accounts linked to a mobile number
export const searchAbhaByMobile = async (accessToken, encryptedMobile) => {
  const response = await axios.post(
    'https://abhasbx.abdm.gov.in/abha/api/v3/profile/account/abha/search',
    { scope: ['search-abha'], mobile: encryptedMobile },
    { headers: getAbdmHeaders(accessToken) }
  );
  return response.data;
};

// Step 2 (mobile flow): Request OTP using the index from search response
// otpType: 'abdm' → ABHA mobile OTP, 'aadhaar' → Aadhaar-linked mobile OTP
export const requestLoginOtpByIndex = async (accessToken, encryptedIndex, txnId, otpType = 'abdm') => {
  const isAadhaar = otpType === 'aadhaar';
  const response = await axios.post(
    'https://abhasbx.abdm.gov.in/abha/api/v3/profile/login/request/otp',
    {
      scope: isAadhaar
        ? ['abha-login', 'search-abha', 'aadhaar-verify']
        : ['abha-login', 'search-abha', 'mobile-verify'],
      loginHint: 'index',
      loginId: encryptedIndex,
      otpSystem: isAadhaar ? 'aadhaar' : 'abdm',
      txnId
    },
    { headers: getAbdmHeaders(accessToken) }
  );
  return response.data;
};

// Step 1 (ABHA number flow): Request OTP directly by ABHA number
export const requestLoginOtpByAbhaNumber = async (accessToken, encryptedAbhaNumber) => {
  const response = await axios.post(
    'https://abhasbx.abdm.gov.in/abha/api/v3/profile/login/request/otp',
    {
      scope: ['abha-login'],
      loginHint: 'abha-number',
      loginId: encryptedAbhaNumber,
      otpSystem: 'abdm'
    },
    { headers: getAbdmHeaders(accessToken) }
  );
  return response.data;
};

// Step 2/3 (both flows): Verify OTP and return token + accounts
// otpType matches what was used in requestLoginOtp
export const verifyLoginOtp = async (accessToken, txnId, encryptedOtp, otpType = 'abdm') => {
  const scope = otpType === 'aadhaar'
    ? ['abha-login', 'aadhaar-verify']
    : ['abha-login', 'mobile-verify'];

  const response = await axios.post(
    'https://abhasbx.abdm.gov.in/abha/api/v3/profile/login/verify',
    {
      scope,
      authData: {
        authMethods: ['otp'],
        otp: { txnId, otpValue: encryptedOtp }
      }
    },
    { headers: getAbdmHeaders(accessToken) }
  );
  return response.data;
};

// Fetch full profile after verify (for DOB, gender, address etc.)
export const fetchProfile = async (accessToken, xToken) => {
  const response = await axios.get(
    'https://abhasbx.abdm.gov.in/abha/api/v3/profile/account',
    {
      headers: {
        ...getAbdmHeaders(accessToken),
        'X-Token': `Bearer ${xToken}`
      }
    }
  );
  return response.data;
};
