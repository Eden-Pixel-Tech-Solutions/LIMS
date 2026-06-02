import { getPublicCertificate } from "../services/abdmCertificateService.js";
import { generateAccessToken } from "../services/abdmAuthService.js";
import { encryptData } from "../utils/encryption.js";
import { requestAadhaarOtp } from "../services/abdmAadhaarService.js";
import { enrolByAadhaar } from "../services/abdmEnrolmentService.js";
import { enrolByFaceAuth } from "../services/abdmFaceAuthService.js";
import { initFaceAuth } from "../services/abdmFaceAuthInitService.js";
import { checkCapturePID } from "../services/abdmCapturePIDService.js";
import {
  sendMobileOtp,
  verifyMobileOtp
} from "../services/abdmMobileService.js";

import {
  requestEmailVerification
} from "../services/abdmEmailService.js";

import {
  getAbhaSuggestions
} from "../services/abdmSuggestionService.js";

import {
  createAbhaAddress
} from "../services/abdmAddressService.js";

import {
  searchAbhaByMobile,
  requestLoginOtpByIndex,
  requestLoginOtpByAbhaNumber,
  verifyLoginOtp,
  fetchProfile
} from "../services/abdmProfileLoginService.js";


export const fetchCertificate = async (req, res) => {
  try {

    // STEP 1 → Generate Session Token
    const tokenData = await generateAccessToken();

    const accessToken = tokenData.accessToken;

    // STEP 2 → Pass Token to Certificate API
    const data = await getPublicCertificate(accessToken);

    res.status(200).json({
      success: true,
      data,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });

  }
};

export const generateSession = async (req, res) => {
  try {

    const tokenData = await generateAccessToken();

    res.status(200).json({
      success: true,
      data: tokenData
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Failed to generate ABDM session token',
      error: error.response?.data || error.message
    });

  }
};

export const testEncryption = async (req, res) => {
  try {
    const { value } = req.body;

    const tokenData = await generateAccessToken();
    const accessToken = tokenData.accessToken;

    const certData = await getPublicCertificate(accessToken);

    const encrypted = encryptData(certData.publicKey, value);

    res.status(200).json({
      success: true,
      encrypted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
};

export const generateAadhaarOtp = async (req, res) => {
  try {
    const { aadhaar } = req.body;

    // STEP 1
    const tokenData = await generateAccessToken();
    const accessToken = tokenData.accessToken;

    // STEP 2
    const certData = await getPublicCertificate(accessToken);

    // STEP 3
    const encryptedAadhaar = encryptData(certData.publicKey, aadhaar);

    // STEP 4
    const otpResponse = await requestAadhaarOtp(accessToken, encryptedAadhaar);

    res.status(200).json({
      success: true,
      data: otpResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
};

export const resendAadhaarOtp = async (req, res) => {
  try {
    const { aadhaar } = req.body;

    // Generate token
    const tokenData = await generateAccessToken();
    const accessToken = tokenData.accessToken;

    // Get cert
    const certData = await getPublicCertificate(accessToken);

    // Encrypt Aadhaar
    const encryptedAadhaar = encryptData(certData.publicKey, aadhaar);

    // Resend OTP = Fresh Request
    const response = await requestAadhaarOtp(accessToken, encryptedAadhaar);

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
};

export const verifyAadhaarOtp = async (req, res) => {
  try {
    const { txnId, otp, mobile } = req.body;

    // Generate access token
    const tokenData = await generateAccessToken();
    const accessToken = tokenData.accessToken;

    // Fetch certificate
    const certData = await getPublicCertificate(accessToken);

    // Encrypt OTP
    const encryptedOtp = encryptData(certData.publicKey, otp);

    // Enrol ABHA
    const response = await enrolByAadhaar(accessToken, txnId, encryptedOtp, mobile);

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
};

export const requestMobileOtp =
async (req, res) => {

  try {

    const {
      txnId,
      mobile
    } = req.body;

    // Generate access token
    const tokenData =
      await generateAccessToken();

    const accessToken =
      tokenData.accessToken;

    // Fetch public certificate
    const certData =
      await getPublicCertificate(
        accessToken
      );

    // Encrypt mobile number
    const encryptedMobile =
      encryptData(
        certData.publicKey,
        mobile
      );

    // Send OTP
    const response =
      await sendMobileOtp(
        accessToken,
        txnId,
        encryptedMobile
      );

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error:
        error.response?.data ||
        error.message
    });

  }
};

export const verifyMobileOtpController =
async (req, res) => {

  try {

    const {
      txnId,
      otp
    } = req.body;

    // Generate token
    const tokenData =
      await generateAccessToken();

    const accessToken =
      tokenData.accessToken;

    // Fetch certificate
    const certData =
      await getPublicCertificate(
        accessToken
      );

    // Encrypt OTP
    const encryptedOtp =
      encryptData(
        certData.publicKey,
        otp
      );

    // Verify OTP
    const response =
      await verifyMobileOtp(
        accessToken,
        txnId,
        encryptedOtp
      );

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error:
        error.response?.data ||
        error.message
    });

  }
};

export const sendEmailVerification =
async (req, res) => {

  try {

    const {
      email,
      xToken
    } = req.body;

    // Generate session token
    const tokenData =
      await generateAccessToken();

    const accessToken =
      tokenData.accessToken;

    // Fetch certificate
    const certData =
      await getPublicCertificate(
        accessToken
      );

    // Encrypt email
    const encryptedEmail =
      encryptData(
        certData.publicKey,
        email
      );

    // Send verification link
    const response =
      await requestEmailVerification(
        accessToken,
        xToken,
        encryptedEmail
      );

    res.status(200).json({
      success: true,
      message:
        "Verification email sent"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error:
        error.response?.data ||
        error.message
    });

  }
};

export const fetchAbhaSuggestions =
async (req, res) => {

  try {

    const { txnId, xToken } = req.body;

    const tokenData = await generateAccessToken();
    const accessToken = tokenData.accessToken;

    const response = await getAbhaSuggestions(accessToken, txnId, xToken || null);

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error:
        error.response?.data ||
        error.message
    });

  }
};

export const initFaceAuthController = async (req, res) => {
  try {
    const tokenData = await generateAccessToken();
    const accessToken = tokenData.accessToken;
    const response = await initFaceAuth(accessToken);
    const txnId = response.txnId;
    const qrUrl = `https://phrsbx.abdm.gov.in/face-auth?txnId=${txnId}`;
    res.status(200).json({ success: true, data: { txnId, qrUrl } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
};

export const checkFaceAuthStatusController = async (req, res) => {
  try {
    const { txnId } = req.body;
    const tokenData = await generateAccessToken();
    const accessToken = tokenData.accessToken;
    const response = await checkCapturePID(accessToken, txnId);
    res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
};

export const enrollByFaceAuthController = async (req, res) => {
  try {
    const { aadhaar, mobile, txnId } = req.body;

    const tokenData = await generateAccessToken();
    const accessToken = tokenData.accessToken;

    const certData = await getPublicCertificate(accessToken);
    const encryptedAadhaar = encryptData(certData.publicKey, aadhaar);

    const response = await enrolByFaceAuth(accessToken, txnId, encryptedAadhaar, null, mobile);

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
};

// Mobile flow Step 1: search ABHA accounts by mobile
export const profileSearchController = async (req, res) => {
  try {
    const { mobile } = req.body;
    const tokenData = await generateAccessToken();
    const accessToken = tokenData.accessToken;
    const certData = await getPublicCertificate(accessToken);
    const encryptedMobile = encryptData(certData.publicKey, mobile);
    const response = await searchAbhaByMobile(accessToken, encryptedMobile);
    // response is an array: [{ txnId, ABHA: [{index, ABHANumber, name, gender}] }]
    const result = Array.isArray(response) ? response[0] : response;
    res.status(200).json({ success: true, data: { txnId: result.txnId, accounts: result.ABHA || [] } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
};

// Mobile flow Step 2: send OTP using index from search
export const profileRequestOtpByIndexController = async (req, res) => {
  try {
    const { index, txnId, otpType = 'abdm' } = req.body;
    const tokenData = await generateAccessToken();
    const accessToken = tokenData.accessToken;
    const certData = await getPublicCertificate(accessToken);
    const encryptedIndex = encryptData(certData.publicKey, String(index));
    const response = await requestLoginOtpByIndex(accessToken, encryptedIndex, txnId, otpType);
    res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
};

// ABHA number flow Step 1: send OTP directly by ABHA number
export const profileRequestOtpController = async (req, res) => {
  try {
    const { abhaNumber } = req.body;
    const tokenData = await generateAccessToken();
    const accessToken = tokenData.accessToken;
    const certData = await getPublicCertificate(accessToken);
    const encryptedAbha = encryptData(certData.publicKey, abhaNumber.trim());
    const response = await requestLoginOtpByAbhaNumber(accessToken, encryptedAbha);
    res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
};

// Both flows Step final: verify OTP → fetch full profile
export const profileVerifyOtpController = async (req, res) => {
  try {
    const { txnId, otp, otpType = 'abdm' } = req.body;
    const tokenData = await generateAccessToken();
    const accessToken = tokenData.accessToken;
    const certData = await getPublicCertificate(accessToken);
    const encryptedOtp = encryptData(certData.publicKey, otp);
    const verifyResponse = await verifyLoginOtp(accessToken, txnId, encryptedOtp, otpType);
    const xToken = verifyResponse.token;
    // accounts in verify response has basic info; fetch full profile for DOB/address/gender
    let profile = verifyResponse.accounts?.[0] || {};
    try {
      const fullProfile = await fetchProfile(accessToken, xToken);
      profile = { ...profile, ...fullProfile };
    } catch { /* use partial profile from verify response */ }
    res.status(200).json({ success: true, data: { profile, xToken } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
};

export const createAbhaAddressController = async (req, res) => {
  try {
    const { txnId, abhaAddress } = req.body;

    const tokenData = await generateAccessToken();
    const accessToken = tokenData.accessToken;

    const response = await createAbhaAddress(accessToken, txnId, abhaAddress);

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
};