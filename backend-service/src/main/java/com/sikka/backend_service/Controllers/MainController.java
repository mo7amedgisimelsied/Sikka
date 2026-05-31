package com.sikka.backend_service.Controllers;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.sikka.backend_service.Configs.MqttGateway;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(path = "/api")
public class MainController {

    @PostMapping("/publish2")
    public void publish2(@RequestParam String message){
        System.out.println(message);
    }
    private final MqttGateway mqttGateway;

    public MainController(MqttGateway mqttGateway) {
        this.mqttGateway = mqttGateway;
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

}
