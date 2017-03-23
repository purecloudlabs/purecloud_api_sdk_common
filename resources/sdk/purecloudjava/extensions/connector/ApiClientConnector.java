package com.mypurecloud.sdk.v2.connector;

import com.mypurecloud.sdk.v2.ApiRequest;
import com.mypurecloud.sdk.v2.ApiResponse;

import java.io.InputStream;
import java.util.concurrent.Future;

public interface ApiClientConnector extends AutoCloseable {
    ApiResponse<String> invoke(ApiRequest<String> request) throws Exception;
    Future<ApiResponse<String>> invokeAsync(ApiRequest<String> request);
}
