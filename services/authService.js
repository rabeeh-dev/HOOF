const User = require("../model/User");
const Otp = require("../model/Otp");
const bcrypt = require("bcrypt");
const { generateOtp } = require("../utils/generateOtp");
const { sendOtpEmail } = require("../utils/sendEmail");

class AuthService {

    //Signup Function


  async initiateSignup(fullName, email, password) {
    // 1. Business Logic: Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists");
    }

    // 2. Security: Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. OTP Logic: Generate and Hash
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // 4. Persistence: Clean old OTPs and create new one
    await Otp.deleteMany({ email });
    await Otp.create({
      email,
      otp: hashedOtp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      lastSentAt: new Date(),
    });

    // 5. Communication: Send Email
    await sendOtpEmail(email, otp);

    // Return the processed data back to the controller
    return {
      pendingUser: {
        fullName,
        email,
        password: hashedPassword,
      },
      otp // Raw OTP for dev console
    };
  }

  //Verify Otp Fucntion

    async verifyOtpCode({ otp, email, mode, userId, pendingUserData }) {
        // 1. Fetch latest OTP
        const otpRecord = await Otp.findOne({ email }).sort({ createdAt: -1 });

        // 2. Validation
        if (!otpRecord) throw new Error("No OTP record found");
        if (otpRecord.expiresAt < Date.now()) throw new Error("OTP has expired");
        
        const isMatch = await bcrypt.compare(otp, otpRecord.otp);
        if (!isMatch) throw new Error("Invalid OTP code");

        // 3. Cleanup OTPs for this email
        await Otp.deleteMany({ email });

        // 4. Execute business logic based on mode
        let redirectUrl = "";

        if (mode === 'NEW_EMAIL_UPDATE') {
            await User.findByIdAndUpdate(userId, { email });
            redirectUrl = "/user/profile?emailChanged=true";
        } 
        else if (mode === 'VERIFY_OLD_EMAIL') {
            redirectUrl = "/user/profile/change-email-form";
        } 
        else { // Default: NEW_SIGNUP
            await User.create({ 
                ...pendingUserData, 
                authProvider: "local", 
                isEmailVerified: true 
            });
            redirectUrl = "/user/login?signupSuccess=true";
        }

        return { success: true, redirectUrl };
    }

    // Resend Otp Function

    async processResendOtp(email) {
        // 1. Business Rule: Check for 1-minute cooldown
        const existingOtp = await Otp.findOne({ email });

        if (existingOtp?.lastSentAt) {
            const diff = Date.now() - existingOtp.lastSentAt.getTime();
            if (diff < 60 * 1000) {
                // We throw a custom error to differentiate rate limiting from other errors
                const error = new Error("Please wait 1 minute before requesting another OTP");
                error.status = 429; 
                throw error;
            }
        }

        // 2. Clear old OTPs
        await Otp.deleteMany({ email });

        // 3. Generate and Hash new OTP
        const otp = generateOtp();
        const hashedOtp = await bcrypt.hash(otp, 10);

        // 4. Save new OTP
        await Otp.create({
            email,
            otp: hashedOtp,
            expiresAt: Date.now() + 5 * 60 * 1000,
            lastSentAt: new Date(),
        });

        // 5. Send Email
        await sendOtpEmail(email, otp);

        return otp; // Return raw OTP for dev logging
    }

    //Login Function
    
    async authenticateUser(email, password) {
        // 1. Fetch user with password
        const user = await User.findOne({ email }).select("+password");

        // 2. Check existence and provider
        if (!user || user.authProvider !== "local") {
            throw new Error("Invalid email or password");
        }

        // 3. Business Rule: The Ban Check
        if (user.isBlocked) {
            throw new Error("Your account has been suspended. Please contact support.");
        }

        // 4. Security: Password Match
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error("Invalid email or password");
        }

        // Return user data (without password) for the controller to use
        return {
            _id: user._id,
            fullName: user.fullName,
            email: user.email
        };
    }
}

module.exports = new AuthService();