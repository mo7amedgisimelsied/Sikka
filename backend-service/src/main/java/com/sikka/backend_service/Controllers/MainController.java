package com.sikka.backend_service.Controllers;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.sikka.backend_service.Configs.MqttGateway;
import com.sikka.backend_service.Models.TestTable;
import com.sikka.backend_service.Repositories.TestTableRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(path = "/api")
public class MainController {

    private final MqttGateway mqttGateway;
    private TestTableRepository testTableRepository;

    public MainController(MqttGateway mqttGateway, TestTableRepository testTableRepository) {
        this.mqttGateway = mqttGateway;
        this.testTableRepository = testTableRepository;
    }

    @PostMapping("/publish2")
    public void publish2(@RequestParam String message){
        System.out.println(message);
    }




    @PostMapping("/publish")
    public ResponseEntity<?> publish(@RequestBody String mqttMessage) {
        try {
            JsonObject convertObject = new Gson().fromJson(mqttMessage, JsonObject.class);
            mqttGateway.senToMqtt(convertObject.get("message").toString(), convertObject.get("topic").toString());
            return ResponseEntity.ok("Success");
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.ok("fail");
        }
    }

    @GetMapping("/users")
    public List<TestTable> allUsers(){
        return testTableRepository.findAll();
    }

}
