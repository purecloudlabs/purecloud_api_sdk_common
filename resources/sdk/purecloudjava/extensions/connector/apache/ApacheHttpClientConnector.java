package com.mypurecloud.sdk.v2.connector.apache;

import com.mypurecloud.sdk.v2.ApiRequest;
import com.mypurecloud.sdk.v2.ApiResponse;
import com.mypurecloud.sdk.v2.connector.ApiClientConnector;
import org.apache.http.NameValuePair;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.*;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.message.BasicNameValuePair;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Future;

public class ApacheHttpClientConnector implements ApiClientConnector {
    private final CloseableHttpClient client;

    public ApacheHttpClientConnector(CloseableHttpClient client) {
        this.client = client;
    }

    @Override
    public ApiResponse<String> invoke(ApiRequest<String> request) throws Exception {
        // Build request object
        HttpUriRequest httpUriRequest;
        String method = request.getMethod();
        String url = request.getPath();
        String body = request.getBody();

        if ("GET".equals(method)) {
            HttpGet req = new HttpGet(url);
            httpUriRequest = req;
        } else if ("POST".equals(method)) {
            HttpPost req = new HttpPost(url);
            if (request.getContentType().startsWith("application/x-www-form-urlencoded")) {
                List<NameValuePair> nvps = new ArrayList<>();
                for (Map.Entry<String, Object> param : request.getFormParams().entrySet()) {
                    nvps.add(new BasicNameValuePair(param.getKey(), param.getValue().toString()));
                }
                req.setEntity(new UrlEncodedFormEntity(nvps));
            } else if (body != null) {
                req.setEntity(new StringEntity(body, "UTF-8"));
            }
            httpUriRequest = req;
        } else if ("PUT".equals(method)) {
            HttpPut req = new HttpPut(url);
            if (body != null) {
                req.setEntity(new StringEntity(body, "UTF-8"));
            }
            httpUriRequest = req;
        } else if ("DELETE".equals(method)) {
            HttpDelete req = new HttpDelete(url);
            httpUriRequest = req;
        } else if ("PATCH".equals(method)) {
            HttpPatch req = new HttpPatch(url);
            if (body != null) {
                req.setEntity(new StringEntity(body, "UTF-8"));
            }
            httpUriRequest = req;
        } else {
            throw new Exception("Unknown method type " + method);
        }

        for (Map.Entry<String, String> entry : request.getHeaders().entrySet()) {
            httpUriRequest.setHeader(entry.getKey(), entry.getValue());
        }

        CloseableHttpResponse response = client.execute(httpUriRequest);

        return new ApacheHttpResponse(response);
    }

    @Override
    public Future<ApiResponse<String>> invokeAsync(ApiRequest<String> request) {
        throw new RuntimeException("Not yet implemented");
    }

    @Override
    public void close() throws IOException {
        client.close();
    }
}
