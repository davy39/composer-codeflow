<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Initialization Guide</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        /* Custom font for code blocks */
        code {
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
        }
    </style>
</head>
<body class="bg-slate-100 text-slate-800 min-h-screen py-10 px-4">

    <main class="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
        
        <!-- Header -->
        <header class="bg-indigo-600 text-white p-8">
            <h1 class="text-3xl font-extrabold tracking-tight">Project Initialization Guide</h1>
            <p class="mt-2 text-indigo-100 text-lg">
                How to bootstrap Laravel or Symfony using <code class="bg-indigo-700 px-2 py-0.5 rounded text-sm">npm run composer</code>
            </p>
        </header>

        <div class="p-8 space-y-8">

            <!-- Step 0: Warning -->
            <div class="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-amber-800">Crucial Prerequisite</h3>
                        <div class="mt-2 text-sm text-amber-700">
                            <p>Before proceeding, you must <strong>delete the <code class="bg-amber-100 px-1 py-0.5 rounded font-bold">public</code> folder</strong>.</p>
                            <p class="mt-1">The installation command requires the target directory to be clean of conflicting files.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Introduction -->
            <p class="text-gray-600 leading-relaxed">
                To generate a project directly at the root (without creating a subfolder), we use the <span class="font-bold text-gray-900">dot (<code class="bg-gray-200 px-1 rounded">.</code>)</span> at the end of the command.
            </p>

            <hr class="border-gray-200">

            <!-- Option 1: Laravel -->
            <section>
                <div class="flex items-center mb-4">
                    <span class="bg-red-100 text-red-600 p-2 rounded-lg mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    </span>
                    <h2 class="text-2xl font-bold text-gray-800">Option 1: Laravel</h2>
                </div>
                
                <p class="mb-3 text-gray-600 text-sm">Installs the complete framework structure.</p>
                <div class="bg-slate-800 rounded-lg p-4 overflow-x-auto shadow-inner group">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-xs text-slate-400 font-mono">Terminal</span>
                    </div>
                    <code class="text-green-400 text-sm block">npm run composer create-project laravel/laravel .</code>
                </div>
            </section>

            <!-- Option 2: Symfony -->
            <section>
                <div class="flex items-center mb-4 mt-8">
                    <span class="bg-black text-white p-2 rounded-lg mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                    </span>
                    <h2 class="text-2xl font-bold text-gray-800">Option 2: Symfony</h2>
                </div>

                <div class="grid gap-6">
                    <!-- Symfony Web -->
                    <div class="bg-gray-50 p-5 rounded-xl border border-gray-100">
                        <h3 class="font-bold text-gray-800 mb-2">A. Full Web Application</h3>
                        <p class="text-sm text-gray-600 mb-3">Includes Twig, forms, and standard dependencies (Classic approach).</p>
                        <div class="bg-slate-800 rounded-lg p-4 overflow-x-auto shadow-inner">
                            <code class="text-green-400 text-sm block">npm run composer create-project symfony/website-skeleton .</code>
                        </div>
                    </div>

                    <!-- Symfony API/Micro -->
                    <div class="bg-gray-50 p-5 rounded-xl border border-gray-100">
                        <h3 class="font-bold text-gray-800 mb-2">B. Microservice / API (Recommended)</h3>
                        <p class="text-sm text-gray-600 mb-3">Starts small. You add what you need.</p>
                        
                        <div class="space-y-3">
                            <div>
                                <p class="text-xs text-slate-500 font-mono mb-1">1. Install skeleton</p>
                                <div class="bg-slate-800 rounded-lg p-3 overflow-x-auto shadow-inner">
                                    <code class="text-green-400 text-sm block">npm run composer create-project symfony/skeleton .</code>
                                </div>
                            </div>
                            <div>
                                <p class="text-xs text-slate-500 font-mono mb-1">2. (Optional) Turn into Web App</p>
                                <div class="bg-slate-800 rounded-lg p-3 overflow-x-auto shadow-inner">
                                    <code class="text-green-400 text-sm block">npm run composer require webapp</code>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Explanation Footer -->
            <div class="bg-indigo-50 rounded-xl p-6 mt-8">
                <h4 class="text-indigo-900 font-bold mb-2">Why does this work?</h4>
                <ul class="list-disc list-inside text-indigo-800 text-sm space-y-2">
                    <li>The command clones the framework repository.</li>
                    <li>The <strong class="bg-indigo-200 px-1 rounded text-indigo-900">.</strong> tells Composer to install inside the <em>current directory</em> instead of creating a new folder.</li>
                    <li>Dependencies are automatically installed via <code class="font-mono text-xs bg-indigo-200 px-1 rounded">npm run composer install</code> logic.</li>
                </ul>
            </div>

        </div>
    </main>
    
    <footer class="text-center text-slate-400 text-sm mt-8 pb-10">
        Generated for CLI setup instructions
    </footer>

</body>
</html>