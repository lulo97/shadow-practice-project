package com.lulo97.backend.features.session;

import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lulo97.backend.Result;

@Service
@Transactional
public class SessionServiceImpl implements SessionService {
    private final SessionRepository repo;
    private final int EXPIRES_DAYS = 7;

    public SessionServiceImpl(SessionRepository repo) {
        this.repo = repo;
    }

    @Override
    public Result<String> create(Long user_id, String token) {
        if (this.existsValidToken(user_id, token)) {
            return Result.fail("Session already exist!");
        }

        var new_row = new Session();
        new_row.setUserId(user_id);
        new_row.setToken(token);
        new_row.setExpiresAt(LocalDateTime.now().plusDays(EXPIRES_DAYS));
        this.repo.save(new_row);

        return Result.ok("");
    }

    @Override
    public Result<String> delete(Long id) {
        var row_result = this.repo.findById(id);

        if (row_result.isEmpty()) {
            return Result.fail("Session not exist!");
        }

        var row = row_result.get();

        this.repo.delete(row);

        return Result.ok("");
    }

    public Boolean existsValidToken(Long user_id, String token) {
        var row = this.repo.findByTokenAndUserId(user_id, token);

        if (row.isEmpty())
            return false;

        var session = row.get();

        if (session.getExpiresAt().isBefore(LocalDateTime.now())) {
            return false;
        }
        return true;
    }

}
