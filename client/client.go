package main

import (
    "bufio"
    "fmt"
    "net"
    "os"
)

func main() {
    conn, err := net.Dial("tcp", "localhost:5001")
    if err != nil {
        fmt.Println("Ошибка подключения:", err)
        return
    }
    defer conn.Close()

    go func() {
        reader := bufio.NewReader(conn)
        for {
            msg, err := reader.ReadString('\n')
            if err != nil {
                fmt.Println("\nСоединение закрыто.")
                os.Exit(0)
            }
            fmt.Print(msg)
        }
    }()

    stdin := bufio.NewReader(os.Stdin)
    for {
        text, _ := stdin.ReadString('\n')
        conn.Write([]byte(text))
    }
}
