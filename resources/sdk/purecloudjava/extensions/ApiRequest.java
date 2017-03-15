package com.mypurecloud.sdk.v2;

import java.util.List;
import java.util.Map;

public interface ApiRequest {
    Object getBody();

    List<Pair> getQueryParams();

    List<Pair> getPathParams();

    Map<String, Object> getFormParams();

    Map<String, String> getHeaderParams();
}