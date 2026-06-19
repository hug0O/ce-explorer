package main

import "fmt"

type Server struct {
	Host     string
	Port     int
	Protocol string
	running  bool
}

type Config interface {
	GetString(key string) string
	GetInt(key string) int
	Validate() bool
}

func NewServer(host string, port int) *Server {
	return &Server{
		Host:     host,
		Port:     port,
		Protocol: "tcp",
		running:  false,
	}
}

func (s *Server) Start() error {
	s.running = true
	fmt.Printf("Server started on %s:%d\n", s.Host, s.Port)
	return nil
}

func (s *Server) Stop() {
	s.running = false
	fmt.Println("Server stopped")
}

func (s *Server) IsRunning() bool {
	return s.running
}

func (s *Server) Address() string {
	return fmt.Sprintf("%s:%d", s.Host, s.Port)
}

func CreateDefaultServer() *Server {
	return NewServer("localhost", 8080)
}
