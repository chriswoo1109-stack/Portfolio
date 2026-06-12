package com.portfolio.controller;

import com.portfolio.model.ContactMessage;
import com.portfolio.service.ContactService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @PostMapping
    public ResponseEntity<?> sendMessage(@RequestBody ContactMessage message) {
        if (message.name() == null || message.name().isBlank() ||
            message.email() == null || message.email().isBlank() ||
            message.message() == null || message.message().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "이름, 이메일, 메시지를 모두 입력해주세요."));
        }
        contactService.save(message);
        return ResponseEntity.ok(Map.of("message", "메시지가 성공적으로 전송되었습니다."));
    }
}
