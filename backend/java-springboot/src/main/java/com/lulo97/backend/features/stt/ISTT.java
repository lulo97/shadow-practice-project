package com.lulo97.backend.features.stt;

import org.springframework.scheduling.config.Task;

public interface ISTT {
    String Run(byte[] blob);

    String GetKey();
}
