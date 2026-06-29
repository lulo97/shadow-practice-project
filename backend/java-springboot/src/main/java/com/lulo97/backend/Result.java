package com.lulo97.backend;

public class Result<T> {
    private boolean success;
    private String error;
    private T data;

    public Result(boolean success, String error, T data) {
        this.success = success;
        this.error = error;
        this.data = data;
    }

    public static <T> Result<T> ok(T data) {
        return new Result<>(true, null, data);
    }

    public static <T> Result<T> fail(String error) {
        return new Result<>(false, error, null);
    }

    public boolean isSuccess() {
        return success;
    }

    public String getError() {
        return error;
    }

    public T getData() {
        return data;
    }
}