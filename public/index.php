<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Setup Guide</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        code { font-family: 'Menlo', 'Monaco', 'Courier New', monospace; }
        .step-number { font-feature-settings: "tnum"; font-variant-numeric: tabular-nums; }
    </style>
</head>
<body class="bg-slate-100 text-slate-800 min-h-screen py-10 px-4">

    <main class="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
        
        <!-- Header -->
        <header class="bg-indigo-700 text-white p-8">
            <h1 class="text-3xl font-extrabold tracking-tight">Setup a PHP website with composer</h1>
            <p class="mt-2 text-indigo-100 text-lg">
                How to force a framework installation when files (like this guide) already exist.
            </p>
        </header>

        <div class="p-8 space-y-10">

            <!-- Context / The Problem -->
            <div class="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-md">
                <h3 class="text-lg font-bold text-blue-900 mb-2">Why this specific procedure?</h3>
                <p class="text-blue-800 leading-relaxed">
                    Composer's <code class="bg-blue-100 px-1 py-0.5 rounded text-sm font-bold">create-project</code> command <span class="font-bold underline">fails</span> if the destination folder contains any files (like this <em>index.php</em>).
                    <br><br>
                    To bypass this, we must install the framework into a <span class="font-mono bg-blue-200 px-1 rounded">temp_app</span> folder first, then merge it into the current root directory.
                </p>
            </div>

            <!-- STEP 1: Install -->
            <section>
                <div class="flex items-center mb-4">
                    <div class="flex-shrink-0 bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 step-number">1</div>
                    <h2 class="text-2xl font-bold text-gray-800">Install into a Temporary Folder</h2>
                </div>
                <p class="mb-4 text-gray-600 ml-11">Choose your framework. Note that we are NOT using the dot <code class="bg-gray-200 px-1 rounded">.</code> here, but a folder name.</p>

                <div class="grid md:grid-cols-2 gap-6 ml-11">
                    <!-- Option A: Laravel -->
                    <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-red-300 transition-colors">
                        <div class="flex items-center mb-3">
                            <span class="text-red-600 font-bold mr-2">Laravel</span>
                        </div>
                        <div class="bg-slate-800 rounded-lg p-3 overflow-x-auto shadow-inner">
                            <code class="text-green-400 text-sm whitespace-nowrap">npm run composer create-project laravel/laravel temp_app</code>
                        </div>
                    </div>

                    <!-- Option B: Symfony -->
                    <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-black transition-colors">
                        <div class="flex items-center mb-3">
                            <span class="text-black font-bold mr-2">Symfony</span>
                            <span class="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">Skeleton</span>
                        </div>
                        <div class="bg-slate-800 rounded-lg p-3 overflow-x-auto shadow-inner">
                            <code class="text-green-400 text-sm whitespace-nowrap">npm run composer create-project symfony/skeleton temp_app</code>
                        </div>
                    </div>
                </div>
            </section>

            <!-- STEP 2: Merge -->
            <section>
                <div class="flex items-center mb-4">
                    <div class="flex-shrink-0 bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 step-number">2</div>
                    <h2 class="text-2xl font-bold text-gray-800">Merge & Cleanup</h2>
                </div>
                
                <div class="ml-11">
                    <p class="mb-3 text-gray-600">
                        We use <code class="bg-gray-100 px-1 rounded text-red-500">cp -R</code> to merge directories. 
                        <br>
                        <span class="text-sm italic text-gray-500">Important: The syntax <code class="font-mono">temp_app/.</code> ensures hidden files (like .env) are copied too.</span>
                    </p>

                    <div class="bg-slate-900 rounded-lg p-5 shadow-2xl">
                        <div class="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                            <span class="text-xs text-slate-400 font-mono">Terminal (Run these commands sequentially)</span>
                        </div>
                        <div class="space-y-2 font-mono text-sm">
                            <div class="flex">
                                <span class="text-slate-500 select-none mr-3">$</span>
                                <code class="text-yellow-400">cp -R temp_app/. .</code>
                                <span class="text-slate-500 ml-2"># Merge files into current dir</span>
                            </div>
                            <div class="flex">
                                <span class="text-slate-500 select-none mr-3">$</span>
                                <code class="text-red-400">rm -rf temp_app</code>
                                <span class="text-slate-500 ml-2"># Delete the temp folder</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- STEP 3: Launch -->
            <section>
                <div class="flex items-center mb-4">
                    <div class="flex-shrink-0 bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 step-number">3</div>
                    <h2 class="text-2xl font-bold text-gray-800">Launch Project</h2>
                </div>

                <div class="ml-11">
                    <p class="mb-3 text-gray-600">Once everything is merged, start your development environment.</p>
                    <div class="bg-slate-800 rounded-lg p-4 inline-block pr-12 shadow-md">
                        <code class="text-green-400 font-bold text-lg">npm run dev</code>
                    </div>
                </div>
            </section>

            <hr class="border-gray-200 my-8">

            <!-- Footer Note -->
            <div class="bg-gray-50 rounded-lg p-4 text-center">
                <p class="text-sm text-gray-500">
                    Note: Your original <strong>index.php</strong> (this file) will likely be overwritten if the framework has an index.php in the root, 
                    or it will stop being the entry point (frameworks usually use <code>/public/index.php</code>).
                </p>
            </div>

        </div>
    </main>
    
    <footer class="text-center text-slate-400 text-sm mt-8 pb-10">
        Generated for CLI Setup • PHP Frameworks
    </footer>

</body>
</html>