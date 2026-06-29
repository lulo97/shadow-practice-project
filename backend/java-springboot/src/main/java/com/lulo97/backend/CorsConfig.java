package com.lulo97.backend;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration //Auto scan by spring
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        System.out.println("Add cors for frontend");
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3001")
                .allowedMethods("*")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}