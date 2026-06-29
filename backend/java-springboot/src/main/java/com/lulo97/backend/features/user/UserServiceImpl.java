package com.lulo97.backend.features.user;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.lulo97.backend.Result;
import com.lulo97.backend.features.session.SessionRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository repo;
    private final SessionRepository repoSession;

    public UserServiceImpl(UserRepository repo, SessionRepository repoSession) {
        this.repo = repo;
        this.repoSession = repoSession;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Users> findAll() {
        return repo.findAll().stream().toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Users findById(Long id) {
        return repo.findById(id)

                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + id));
    }

    @Override
    public Users create(String username, String rawPassword) {
        if (repo.existsByUsername(username))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken: " + username);

        Users user = new Users();
        user.setUsername(username);
        user.setPassword(rawPassword); // hash this before calling setPassword in real life
        return repo.save(user);
    }

    @Override
    public void delete(Long id) {
        if (!repo.existsById(id))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + id);
        repo.deleteById(id);
    }

    @Override
    public Result<Users> findByToken(String token) {
        var row = this.repoSession.findByToken(token);

        if (row.isEmpty()) return Result.fail("Token not exist");

        var session = row.get();

        if (session.getExpiresAt().isBefore(LocalDateTime.now())) return Result.fail("Token expired");

        var user = this.repo.findById(session.getUserId());

        if (user.isEmpty()) return Result.fail("User not exist");

        return Result.ok(user.get());
    }

    @Override
    public Optional<Users> findByUsername(String username) {
        return repo.findByUsername(username);
    }
}