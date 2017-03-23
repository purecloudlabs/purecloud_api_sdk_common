package com.mypurecloud.sdk.v2.connector;

public interface ApiClientConnectorProperties {
    <T> T getProperty(String key, T defaultValue);
}
