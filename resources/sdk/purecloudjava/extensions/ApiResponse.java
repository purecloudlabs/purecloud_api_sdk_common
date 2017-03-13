package com.mypurecloud.sdk.v2;

import org.apache.http.Header;
import org.apache.http.client.methods.*;
import org.apache.http.util.EntityUtils;

import java.io.IOException;
import java.net.URI;

public class ApiResponse<T> {
    private CloseableHttpResponse httpResponse = null;
    private T responseObject = null;
    private String rawResponseBody = "";
    private boolean hasRawBody = false;
    private HttpUriRequest httpRequest = null;
    private Exception exception = null;


    public ApiResponse(HttpUriRequest httpRequest, CloseableHttpResponse responseData) {
        this.httpRequest = httpRequest;
        this.httpResponse = responseData;
    }


    protected void setException(Exception exception) {
        this.exception = exception;
    }

    /**
     * Gets the exception. Returns null if no exception was encountered.
     *
     * @return Exception
     */
    public Exception getException() {
        return exception;
    }

    protected void setHttpResponse(CloseableHttpResponse httpResponse) {
        this.httpResponse = httpResponse;
    }

    /**
     * Gets the CloseableHttpResponse response object. Use getResponseObject() to get the typed response payload object.
     *
     * @return CloseableHttpResponse
     */
    public CloseableHttpResponse getHttpResponse() {
        return httpResponse;
    }

    protected void setResponseObject(T responseObject) {
        this.responseObject = responseObject;
    }

    /**
     * Gets the typed response payload object
     *
     * @return The return type
     */
    public T getResponseObject() {
        return responseObject;
    }

    /**
     * Gets the HTTP response code
     *
     * @return int
     */
    public int getResponseCode() {
        return httpResponse != null ? httpResponse.getStatusLine().getStatusCode() : -1;
    }

    protected void setHttpRequest(HttpUriRequest httpRequest) {
        this.httpRequest = httpRequest;
    }

    /**
     * Returns the HttpUriRequest request object.
     *
     * @return HttpUriRequest
     */
    public HttpUriRequest getHttpRequest() {
        return httpRequest;
    }

    /**
     * Gets the headers sent with the request
     *
     * @return Header[]
     */
    public Header[] getRequestHeaders() {
        return httpRequest != null ? httpRequest.getAllHeaders() : null;
    }

    /**
     * Gets the request headers as a single string with the format for each header: &lt;name>: &lt;value>\n
     *
     * @return String
     */
    public String getRequestHeaderData() {
        StringBuilder sb = new StringBuilder();
        for (Header h : getRequestHeaders()) {
            sb.append(h.getName());
            sb.append(": ");
            sb.append(h.getValue());
            sb.append("\n");
        }
        return sb.toString().trim();
    }

    /**
     * Gets the headers returned with the response
     *
     * @return Header[]
     */
    public Header[] getResponseHeaders() {
        return httpResponse != null ? httpResponse.getAllHeaders() : null;
    }

    /**
     * Gets the response headers as a single string with the format for each header: &lt;name>: &lt;value>\n
     *
     * @return String
     */
    public String getResponseHeaderData() {
        StringBuilder sb = new StringBuilder();
        for (Header h : getResponseHeaders()) {
            sb.append(h.getName());
            sb.append(": ");
            sb.append(h.getValue());
            sb.append("\n");
        }
        return sb.toString().trim();
    }

    /**
     * Gets the value of the ININ-Correlation-Id header
     *
     * @return String
     */
    public String getCorrelationId() {
        if (httpResponse == null) return "";
        Header header = httpResponse.getFirstHeader("ININ-Correlation-Id");
        return header != null ? header.getValue() : null;
    }

    protected void setRawResponseBody(String rawResponseBody) {
        this.rawResponseBody = rawResponseBody;
        hasRawBody = rawResponseBody != null && !rawResponseBody.isEmpty();
    }

    /**
     * Gets the response body as a string
     *
     * @return String
     */
    public String getRawResponseBody() {
        return rawResponseBody;
    }

    /**
     * [True] if the response has a body
     *
     * @return boolean
     */
    public boolean hasHasRawBody() {
        return hasRawBody;
    }

    /**
     * Gets the full request URI
     *
     * @return URI
     */
    public URI getRequestUri() {
        return httpRequest != null ? httpRequest.getURI() : null;
    }

    /**
     * Gets the request body as a string
     *
     * @return String
     */
    public String getRawRequestBody() {
        if (httpRequest == null) return "";
        Class requestClass = httpRequest.getClass();
        if (requestClass == HttpPost.class) {
            HttpPost request = (HttpPost) httpRequest;
            try {
                return EntityUtils.toString(request.getEntity());
            } catch (IOException e) {
                return "ERROR";
            }
        } else if (requestClass == HttpPatch.class) {
            HttpPatch request = (HttpPatch) httpRequest;
            try {
                return EntityUtils.toString(request.getEntity());
            } catch (IOException e) {
                return "ERROR";
            }
        } else if (requestClass == HttpPut.class) {
            HttpPut request = (HttpPut) httpRequest;
            try {
                return EntityUtils.toString(request.getEntity());
            } catch (IOException e) {
                return "ERROR";
            }
        } else {
            return httpRequest.getRequestLine().toString();
        }
    }
}
