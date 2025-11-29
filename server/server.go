package main

import (
    "bufio"
    "fmt"
    "net"
    "sync"
)

var clients = make(map[net.Conn]bool)
var mu sync.Mutex

func broadcast(sender net.Conn, msg string) {
    mu.Lock()
    defer mu.Unlock()
    for c := range clients {
        if c != sender {
            c.Write([]byte(msg))
        }
    }
}

func handleClient(conn net.Conn) {
    defer func() {
        mu.Lock()
        delete(clients, conn)
        mu.Unlock()
        conn.Close()
        fmt.Println(conn.RemoteAddr(), "отключился")
    }()

    reader := bufio.NewReader(conn)
    for {
        msg, err := reader.ReadString('\n')
        if err != nil {
            return
        }
        fmt.Print(conn.RemoteAddr(), ": ", msg)
        broadcast(conn, conn.RemoteAddr().String()+": "+msg)
    }
}

func main() {
    ln, err := net.Listen("tcp", ":5001")
    if err != nil {
        fmt.Println("Ошибка прослушивания:", err)
        return
    }
    defer ln.Close()
    fmt.Println("Сервер запущен на :5001")

    for {
        conn, err := ln.Accept()
        if err != nil {
            fmt.Println("Ошибка подключения:", err)
            continue
        }
        fmt.Println("Подключен:", conn.RemoteAddr())
        mu.Lock()
        clients[conn] = true
        mu.Unlock()
        go handleClient(conn)
    }
}
