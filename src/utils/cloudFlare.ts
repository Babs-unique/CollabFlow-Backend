import axios from "axios";
import env from "../configs/env.js";
import logger from "../lib/logger.js";


interface TurnstileResponse {
    success: boolean;
    challenge_ts?: string;
    hostname?: string;
    action?: string;
    cdata?: string;
    ["error-codes"]?: string[];
    metadata?:{
        "ephemeral_id": string;
    }
}

export const validateTurnstile = async (token: string, remoteip: string | undefined): Promise<TurnstileResponse> => {
  try {
    const formData = new URLSearchParams();

    formData.append("secret", env.TURNSTILE_SECRET_KEY);
    formData.append("response", token);
    
    if(remoteip)
    formData.append("remoteip", remoteip);

    const { data }: { data: TurnstileResponse } = await axios.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return data;
  } catch (error) {
    // console.error("Turnstile validation failed:", error);
    logger.error({err: error} , "Turnstile validation failed")

    return {
      success: false,
      "error-codes": ["internal-error"],
    };
  }
};