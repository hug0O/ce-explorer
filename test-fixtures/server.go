package main

import "fmt"

type Server struct {
    host    string
    port    int
    running bool
}

func NewServer(host string, port int) *Server {
    return &Server{host: host, port: port, running: false}
}

func (s *Server) Start() {
    s.running = true
    fmt.Printf("Server started on %s:%d\n", s.host, s.port)
}

func (s *Server) Stop() {
    s.running = false
    fmt.Println("Server stopped")
}

func (s *Server) IsRunning() bool {
    return s.running
}

type HTTPServer struct {
    Server
    handler string
}

func NewHTTPServer(host string, port int, handler string) *HTTPServer {
    return &HTTPServer{
        Server:  Server{host: host, port: port, running: false},
        handler: handler,
    }
}

func (h *HTTPServer) HandleRequest() {
    fmt.Printf("Handling request with %s\n", h.handler)
}
