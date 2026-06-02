import express from 'express';
import { generateSession, fetchCertificate, testEncryption, generateAadhaarOtp, resendAadhaarOtp, verifyAadhaarOtp, requestMobileOtp, verifyMobileOtpController, sendEmailVerification, fetchAbhaSuggestions, createAbhaAddressController, initFaceAuthController, checkFaceAuthStatusController, enrollByFaceAuthController, profileSearchController, profileRequestOtpByIndexController, profileRequestOtpController, profileVerifyOtpController } from '../controllers/abdmController.js';

const router = express.Router();

router.get('/session', generateSession);
router.get('/certificate', fetchCertificate);
router.post('/encrypt', testEncryption);
router.post('/aadhaar/request-otp', generateAadhaarOtp);
router.post('/aadhaar/resend-otp', resendAadhaarOtp);
router.post('/aadhaar/verify-otp', verifyAadhaarOtp);
router.post("/mobile/request-otp", requestMobileOtp);
router.post("/mobile/verify-otp", verifyMobileOtpController);
router.post("/email/verify-link", sendEmailVerification);
router.post("/abha/suggestions", fetchAbhaSuggestions);
router.post("/abha/address", createAbhaAddressController);
router.post("/profile/search", profileSearchController);
router.post("/profile/request-otp-by-index", profileRequestOtpByIndexController);
router.post("/profile/request-otp", profileRequestOtpController);
router.post("/profile/verify-otp", profileVerifyOtpController);
router.post("/face/init", initFaceAuthController);
router.post("/face/status", checkFaceAuthStatusController);
router.post("/face/enroll", enrollByFaceAuthController);

export default router;
