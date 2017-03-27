package com.mypurecloud.sdk.v2.connector;

import java.util.concurrent.Future;

public interface ApiClientConnector extends AutoCloseable {
    ApiClientConnectorResponse invoke(ApiClientConnectorRequest request) throws Exception;
    Future<ApiClientConnectorResponse> invokeAsync(ApiClientConnectorRequest request);
}
