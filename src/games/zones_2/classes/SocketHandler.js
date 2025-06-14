export class SocketHandler {
    constructor(socket) {
        this.socket = socket;
        this.smoothX = 0;
        this.smoothY = 0;
        this.deltaX = 0;
        this.deltaY = 0;
        this.smoothingFactor = 0.1;
        this.scaleFactor = 20;

        this.setupSocketListeners();
    }

    setupSocketListeners() {
        if (!this.socket) return;


        this.socket.on("controllerMessage", (data) => {
            const obj = JSON.parse(JSON.stringify(data));

            this.smoothX = this.smoothingFactor * obj.payload.payload.x_acc + (1 - this.smoothingFactor) * this.smoothX;
            this.smoothY = this.smoothingFactor * obj.payload.payload.y_acc + (1 - this.smoothingFactor) * this.smoothY;

            this.deltaX = (this.smoothX - obj.payload.payload.default_pos1) * this.scaleFactor;
            this.deltaY = (this.smoothY - obj.payload.payload.default_pos2) * this.scaleFactor;
            // console.log(this.deltaX, this.deltaY);
        });
    }

    getDeltas() {
        return { x: this.deltaX, y: this.deltaY };
    }
}