package com.lulo97.backend.features.session;

import java.util.List;
import java.util.Optional;

import com.lulo97.backend.Result;

public interface SessionService {
    Result<String> create(Long user_id, String token);
    Result<String> delete(Long id);
}