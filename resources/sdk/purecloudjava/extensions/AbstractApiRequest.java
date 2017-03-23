package com.mypurecloud.sdk.v2;

import java.util.List;
import java.util.Map;

public abstract class AbstractApiRequest<T> implements ApiRequest<T> {
    public abstract String getPath();
    public abstract String getMethod();
    public abstract Map<String, String> getPathParams();
    public abstract List<Pair> getQueryParams();
    public abstract Map<String, Object> getFormParams();
    public abstract Map<String, String> getHeaderParams();
    public abstract Map<String, String> getHeaders();
    public abstract String getContentType();
    public abstract String getAccepts();
    public abstract T getBody();
    public abstract String[] getAuthNames();
}