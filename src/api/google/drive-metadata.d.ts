interface GoogleDriveV3File {
    kind: string; // drive#file
    id: string;
    etag: any;
    selfLink: string;
    webContentLink: string;
    webViewLink: string;
    alternateLink: string;
    embedLink: string;
    openWithLinks: {
        [index: string]: string
    };
    defaultOpenWithLink: string;
    iconLink: string;
    thumbnailLink: string;
    thumbnail: {
        image: any;
        mimeType: string
    };
    title: string;
    mimeType: string;
    description: string;
    labels: {
        starred: boolean;
        hidden: boolean;
        trashed: boolean;
        restricted: boolean;
        viewed: boolean
    };
    createdDate: number;
    modifiedDate: number;
    modifiedByMeDate: number;
    lastViewedByMeDate: number;
    markedViewedByMeDate: number;
    sharedWithMeDate: number;
    version: number;
    sharingUser: {
        kind: string; // drive#user
        displayName: string;
        picture: {
            url: string
        };
        isAuthenticatedUser: boolean;
        permissionId: string;
        emailAddress: string
    };
    parents: Array<GoogleDriveV3File>;
    downloadUrl: string;
    exportLinks: {
        [index: string]: string
    };
    indexableText: {
        text: string
    };
    userPermission: any;
    permissions: Array<any>;
    originalFilename: string;
    fileExtension: string;
    fullFileExtension: string;
    md5Checksum: string;
    fileSize: number;
    quotaBytesUsed: number;
    ownerNames: Array<string>;
    owners: [
        {
            kind: string; // drive#user;
            displayName: string;
            picture: {
                url: string
            };
            isAuthenticatedUser: boolean;
            permissionId: string;
            emailAddress: string
        }
    ];
    lastModifyingUserName: string;
    lastModifyingUser: {
        kind: string; // drive#user;
        displayName: string;
        picture: {
            url: string
        };
        isAuthenticatedUser: boolean;
        permissionId: string;
        emailAddress: string
    };
    ownedByMe: boolean;
    editable: boolean;
    canComment: boolean;
    shareable: boolean;
    copyable: boolean;
    writersCanShare: boolean;
    shared: boolean;
    explicitlyTrashed: boolean;
    appDataContents: boolean;
    headRevisionId: string;
    properties: Array<any>;
    folderColorRgb: string;
    imageMediaMetadata: {
        width: number;
        height: number;
        rotation: number;
        location: {
            latitude: number;
            longitude: number;
            altitude: number
        };
        date: string;
        cameraMake: string;
        cameraModel: string;
        exposureTime: number;
        aperture: number;
        flashUsed: boolean;
        focalLength: number;
        isoSpeed: number;
        meteringMode: string;
        sensor: string;
        exposureMode: string;
        colorSpace: string;
        whiteBalance: string;
        exposureBias: number;
        maxApertureValue: number;
        subjectDistance: number;
        lens: string
    };
    videoMediaMetadata: {
        width: number;
        height: number;
        durationMillis: number
    };
    spaces: [
        string
    ]
}

interface GoogleDriveV3FileList {
    kind: string; // drive#fileList
    nextPageToken: string;
    files: Array<any>;
}