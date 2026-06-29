package com.lulo97.backend.features.auth;

public final class AuthUtils {
    public static String hash(String password) {
        return password;
    }

    public static boolean compareHash(String password, String password_hashed) {
        return password.equals(password_hashed); //String is not primitive
    }

    public static String getToken() {
        return java.util.UUID.randomUUID().toString();
    }

}
