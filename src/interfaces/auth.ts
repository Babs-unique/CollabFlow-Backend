export interface RegisterBody {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    cloudFlareToken?: string;
}



export interface LoginBody {
    email: string;
    password: string;
    cloudFlareToken?: string;
}

export interface ForgotPasswordBody {
    email: string;
}

export interface ResetPasswordBody {
    token: string;
    password: string;
}

export interface VerifyEmailBody {
    token: string;
}
