import crypto from 'crypto';

export function generateSignature(
    accessKeyId: string,
    secretAccessKey: string,
    host: string,
    httpMethod: string,
    uri: string,
    queryString: string,
    headers: Record<string, string>,
    payload: string,
    region: string = "cn-beijing",
    service: string = "cv"
): Record<string, string> {
    // Step 0: Prepare request data
    const requestDate = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const credentialDate = requestDate.substring(0, 8);
    const credentialScope = `${credentialDate}/${region}/${service}/request`;

    // Add required headers
    if (!headers['host']) {
        headers['host'] = host;
    }
    if (!headers['x-date']) {
        headers['x-date'] = requestDate;
    }

    // Calculate payload hash if not provided
    if (!headers['x-content-sha256']) {
        const payloadHash = crypto.createHash('sha256').update(payload).digest('hex');
        headers['x-content-sha256'] = payloadHash;
    }
    const payloadHash = headers['x-content-sha256'];

    // Step 1: Create canonical request
    const sortedHeaders = Object.entries(headers).sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()));
    
    let canonicalHeaders = '';
    let signedHeaders = '';

    sortedHeaders.forEach(([key, value]) => {
        canonicalHeaders += `${key.toLowerCase()}:${value}\n`;
        signedHeaders += `${key.toLowerCase()};`;
    });

    signedHeaders = signedHeaders.slice(0, -1); // Remove trailing semicolon

    const canonicalRequest = [
        httpMethod,
        uri,
        queryString,
        canonicalHeaders,
        signedHeaders,
        payloadHash
    ].join('\n');

    // Step 2: Create string to sign
    const canonicalRequestHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
    const stringToSign = [
        'HMAC-SHA256',
        requestDate,
        credentialScope,
        canonicalRequestHash
    ].join('\n');

    // Step 3: Calculate signature key
    const kSecret = Buffer.from(secretAccessKey, 'utf8');
    const kDate = crypto.createHmac('sha256', kSecret).update(credentialDate).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
    const kSigning = crypto.createHmac('sha256', kService).update('request').digest();

    // Step 4: Calculate signature
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    // Step 5: Create authorization header
    const authorization = [
        'HMAC-SHA256',
        `Credential=${accessKeyId}/${credentialScope}`,
        `SignedHeaders=${signedHeaders}`,
        `Signature=${signature}`
    ].join(', ');

    headers['Authorization'] = authorization;

    return headers;
}

export function createVolcRequest(
    accessKeyId: string,
    secretAccessKey: string,
    host: string,
    action: string,
    version: string,
    payload: Record<string, any> | string,
    region: string = "cn-beijing",
    service: string = "cv"
): RequestInfo {
    const httpMethod = "POST";
    const uri = "/";
    const queryString = `Action=${action}&Version=${version}`;

    // Prepare headers
    const headers: Record<string, string> = {
        'host': host,
        'Content-Type': 'application/json'
    };

    // Convert payload to JSON string if it's an object
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);

    // Generate signature and get updated headers
    const signedHeaders = generateSignature(
        accessKeyId,
        secretAccessKey,
        host,
        httpMethod,
        uri,
        queryString,
        headers,
        payloadStr,
        region,
        service
    );

    // Construct URL
    const url = `https://${host}${uri}?${queryString}`;

    return {
        url,
        method: httpMethod,
        headers: signedHeaders,
        data: payloadStr
    };
} 