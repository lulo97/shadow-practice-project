package com.lulo97.backend.features.stt;

import org.springframework.stereotype.Component;
import com.lulo97.backend.Utils;
import com.lulo97.backend.features.usersetting.UserSetting;

@Component
public class SttFactory {
    private final Whisper whisper;
    private final Parakeet parakeet;

    public SttFactory(Whisper whisper, Parakeet parakeet) {
        this.whisper = whisper;
        this.parakeet = parakeet;
    }

    public ISTT getSTT(UserSetting userSetting) {
        if (userSetting.getSttProviderKey() == Utils.WHISPER_CPP) {
            return whisper;
        } else {
            return parakeet;
        }
    }
}
