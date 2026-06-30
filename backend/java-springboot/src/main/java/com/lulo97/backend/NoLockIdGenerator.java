package com.lulo97.backend;

import java.util.UUID;

import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.id.IdentifierGenerator;

public class NoLockIdGenerator implements IdentifierGenerator {
    @Override
    public Object generate(SharedSessionContractImplementor session, Object object) {
        long id = Math.abs(UUID.randomUUID().getMostSignificantBits());
        return id & 0x1FFFFFFFFFFFFFL; // clamp to 53 bits → always JS-safe
    }
}
