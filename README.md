The purpose of this repository is to house scripts that are used in the process of auto generating api client libraries based on the swagger definition.  

[Javascript Client](https://github.com/MyPureCloud/purecloud_javascript_client)
[C# Client](https://github.com/MyPureCloud/PureCloudApiLibrary_CSharp)
[Ruby Client](https://github.com/MyPureCloud/PureCloudApiLibrary_Ruby)

The process generally looks like this:

- download swagger from https://api.mypurecloud.com/api/v1/docs/swagger
- clean up the operation ids so they create useful method names
- do a diff against the previous swagger file to determine if there are any major, minor, or point changes
- run [Swagger CodeGen] (https://github.com/swagger-api/swagger-codegen) to generate the library
- commit the results back to the language specific library
- tag the release in github
- upload the release to a language specific package manager
