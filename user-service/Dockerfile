FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build

WORKDIR /src

# Copy proto file
COPY proto/user.proto proto/user.proto

# Copy project file and restore
COPY user-service/UserService.csproj user-service/
RUN dotnet restore user-service/UserService.csproj

# Copy source code and build
COPY user-service/ user-service/
RUN dotnet publish user-service/UserService.csproj -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=
ENV ASPNETCORE_HTTP_PORTS=

EXPOSE 50051

ENTRYPOINT ["dotnet", "UserService.dll"]
