

interface PingResponse {
    message: string
}


export default class PingController {

    public async getMessage(message: string): Promise<PingResponse> {
        return {
            message,
        }
    }


    public async ping(): Promise<PingResponse> {
        return {
            message: "hello",
        }
    }
}
