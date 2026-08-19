import React from 'react';
import { FilePond, registerPlugin } from 'react-filepond';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';

// Import FilePond styles
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

// Register plugins
registerPlugin(FilePondPluginImagePreview, FilePondPluginFileValidateType);

/**
 * FilePond Uploader Component
 * Themed for TFE's dark admin interface
 */
export default function FilePondUploader({
    files = [],
    onUpdateFiles,
    server = null,
    allowMultiple = false,
    maxFiles = 1,
    acceptedFileTypes = ['image/*'],
    labelIdle = 'Drag & Drop your image or <span class="filepond--label-action">Browse</span>',
    name = 'file',
    ...props
}) {
    const serverConfig = server ? {
        url: server,
        headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
        }
    } : null;

    return (
        <div className="filepond-dark-wrapper">
            <FilePond
                files={files}
                onupdatefiles={onUpdateFiles}
                allowMultiple={allowMultiple}
                maxFiles={maxFiles}
                server={serverConfig}
                name={name}
                labelIdle={labelIdle}
                acceptedFileTypes={acceptedFileTypes}
                credits={false}
                {...props}
            />
        </div>
    );
}
