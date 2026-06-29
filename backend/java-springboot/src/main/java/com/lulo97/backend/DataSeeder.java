package com.lulo97.backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.lulo97.backend.features.user.UserRepository;
import com.lulo97.backend.features.user.Users;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seed(UserRepository userRepository) {
        return args -> {
            if (userRepository.count() == 0) {
                userRepository.save(new Users(Utils.ADMIN_USERNAME, "M90&Op2p|D<."));
                userRepository.save(new Users("alice-java", "M90&Op2p|D<."));
                System.out.println("Add admin and alice");
            }
        };
    }
}