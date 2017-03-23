package com.mypurecloud.sdk.v2.connector.apache;

import com.mypurecloud.sdk.v2.ApiResponse;
import org.apache.http.Header;
import org.apache.http.HttpEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.entity.BufferedHttpEntity;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.*;

class ApacheHttpResponse implements ApiResponse<String> {
    private static final Logger LOG = LoggerFactory.getLogger(ApacheHttpResponse.class);

    private final CloseableHttpResponse response;

    public ApacheHttpResponse(CloseableHttpResponse response) {
        this.response = response;

        HttpEntity entity = response.getEntity();
        if (!entity.isRepeatable()) {
            try {
                response.setEntity(new BufferedHttpEntity(entity));
            }
            catch (Exception exception) {
                LOG.error("Failed to buffer HTTP entity.", exception);
            }
        }
    }

    @Override
    public Exception getException() {
        return null;
    }

    @Override
    public Integer getStatusCode() {
        return response.getStatusLine().getStatusCode();
    }

    @Override
    public boolean hasRawBody() {
        return false;
    }

    @Override
    public String getRawBody() {
        return null;
    }

    @Override
    public String getBody() {
        try {
            HttpEntity entity = response.getEntity();
            if (entity != null) {
                return EntityUtils.toString(entity);
            }
            return null;
        }
        catch (IOException exception) {
            throw new RuntimeException(exception);
        }
    }

    @Override
    public Map<String, String> getHeaders() {
        Map<String, String> map = new HashMap<>();
        for (Header header : response.getAllHeaders()) {
            map.put(header.getName(), header.getValue());
        }
        return Collections.unmodifiableMap(map);
    }

    @Override
    public String getHeader(String key) {
        Header header = response.getFirstHeader(key);
        return (header != null) ? header.getValue() : null;
    }

    @Override
    public String getCorrelationId() {
        return getHeader("ININ-Correlation-ID");
    }

    @Override
    public void close() throws Exception {
        response.close();
    }
}
