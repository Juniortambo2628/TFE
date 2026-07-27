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
            <style>{`
                .filepond-dark-wrapper .filepond--root {
                    font-family: inherit;
                }
                .filepond-dark-wrapper .filepond--panel-root {
                    background-color: #1a1a1a;
                    border: 1px dashed #3b82f6;
                    border-radius: 12px;
                }
                .filepond-dark-wrapper .filepond--drop-label {
                    color: #888;
                }
                .filepond-dark-wrapper .filepond--drop-label label {
                    color: #888;
                }
                .filepond-dark-wrapper .filepond--label-action {
                    color: #3b82f6;
                    text-decoration: none;
                }
                .filepond-dark-wrapper .filepond--item-panel {
                    background-color: #2a2a2a;
                }
                .filepond-dark-wrapper .filepond--file-action-button {
                    cursor: pointer;
                }
                .filepond-dark-wrapper [data-filepond-item-state*='error'] .filepond--item-panel,
                .filepond-dark-wrapper [data-filepond-item-state*='invalid'] .filepond--item-panel {
                    background-color: #ef4444;
                }
                .filepond-dark-wrapper [data-filepond-item-state='processing-complete'] .filepond--item-panel {
                    background-color: #10b981;
                }
            `}</style>
        </div>
    );
}
