package com.portfolio.service;

import com.portfolio.model.ContactMessage;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ContactService {

    private final List<ContactMessage> inbox = new ArrayList<>();

    public void save(ContactMessage message) {
        inbox.add(message);
    }

    public List<ContactMessage> getAll() {
        return List.copyOf(inbox);
    }
}
