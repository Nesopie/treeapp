import axios from "axios";
import { IncomingMessage } from "http";

export const buildClient = ({
    req,
}: {
    req: IncomingMessage & { cookies: Partial<Record<string, string>> };
}) => {
    return axios.create({
        baseURL:
            "http://ingress-nginx-controller.ingress-nginx.svc.cluster.local",
        headers: req.headers,
    });
};
