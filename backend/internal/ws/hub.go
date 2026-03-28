package ws

import (
	"encoding/json"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  512,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

type InvalidationEvent struct {
	Type      string `json:"type"` // "secret.updated" | "secret.deleted" | "secret.rotated"
	EnvID     string `json:"env_id"`
	SecretKey string `json:"secret_key,omitempty"`
}

type client struct {
	conn  *websocket.Conn
	envID string
	send  chan []byte
}

type Hub struct {
	mu      sync.RWMutex
	clients map[string]map[*client]struct{} // envID -> set of clients
}

func NewHub() *Hub {
	return &Hub{clients: make(map[string]map[*client]struct{})}
}

func (h *Hub) register(c *client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.clients[c.envID] == nil {
		h.clients[c.envID] = make(map[*client]struct{})
	}
	h.clients[c.envID][c] = struct{}{}
}

func (h *Hub) unregister(c *client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if set, ok := h.clients[c.envID]; ok {
		delete(set, c)
		if len(set) == 0 {
			delete(h.clients, c.envID)
		}
	}
	close(c.send)
}

// Broadcast sends an invalidation event to all clients watching a given env.
func (h *Hub) Broadcast(envID string, event InvalidationEvent) {
	h.mu.RLock()
	set := h.clients[envID]
	h.mu.RUnlock()

	b, _ := json.Marshal(event)
	for c := range set {
		select {
		case c.send <- b:
		default:
			// slow client — drop
		}
	}
}

// ServeWS upgrades an HTTP connection and registers it with the hub for envID.
func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request, envID string) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	c := &client{conn: conn, envID: envID, send: make(chan []byte, 64)}
	h.register(c)
	defer h.unregister(c)

	// Write pump
	go func() {
		defer conn.Close()
		for msg := range c.send {
			if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		}
	}()

	// Read pump — we just drain pings; clients don't send data
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			return
		}
	}
}
