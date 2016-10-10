<?php
namespace commands;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

class BuildCommand extends Command
{
    protected $commandName = 'prepare';
    protected $commandDescription = "Builds the files";

    protected $commandArgumentName = "port";
    protected $commandArgumentDescription = "specify the port number to listen to";

    protected $commandOptionName = "port"; // should be specified like "app:greet John --cap"
    protected $commandOptionDescription = 'specify the port number to listen to';

    protected function configure(){
        $this
            ->setName($this->commandName)
            ->setDescription($this->commandDescription)
            ->addArgument(
                $this->commandArgumentName,
                InputArgument::OPTIONAL,
                $this->commandArgumentDescription
            )
            ->addOption(
                $this->commandOptionName,
                null,
                InputOption::VALUE_NONE,
                $this->commandOptionDescription
            )
        ;
    }
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $port = $input->getArgument($this->commandArgumentName);
        $portNumber = 8020;
        if ($input->getOption($this->commandOptionName)) {
            $portNumber = $port;
        }
        $io = new SymfonyStyle($input, $output);
        /**
         * Get the json file
         * Fore each one
         * Get the js
         *  Store it on the scripts portion of the file, get the name
         *
         * A P P L E T   S T R U C T U R E
         * "applets" {
                "id" : {
         *          "mode": "dynamic",
         *          "pages": [
         *              layout
         *              css
         *              events {
                            ready :  "userScripts.exec('script_0')"
         *              }
         *          ]
         * }
         * }
         * "scripts" [
         *      "script_0" : "kfsdlksmlkdmfklsfs"
         *
         */
        $pages = $this->getJSON();
        if (!isset($pages)){
            return $output->writeln("$pages Could not build. Check your permissions");
        }
        $config = [
                    "icon_url" => "https://cdn.formelo.com/uploads/20151216/12/1450268948584-facebook-256x256.png",
                    "user_group" => [],
                    "description" => "ducco",
                    "default_submission_status" => "accepted",
                    "scope" => "public",
                    "name" => "madboysc crew",
                    "id" => "dac0d9ed",
                    "parameters" => [
                         "is_submittable" => true
                    ],
                    'mode' => 'dynamic',
                    'root' => $pages->root,
                    'pages' => [

                    ],
                    'providers' => [

                    ],
                    'dependencies' => [
                        'js' => [

                        ],
                        'css' => [

                        ]
                    ]
        ];
        $io->text("Compiling Pages");
        foreach ($pages->pages as $key){
            $html = $this->getFileContents("app/pages/$key/$key.html");
            $css = $this->getFileContents("app/pages/$key/$key.css");
            $js = $this->getFileContents("app/pages/$key/$key.js");
            // Add js to script and get the scripts blok and store its reference in the main block
            $randomString = $this->str_random();
            $config['scripts'][$randomString] = $js;
            $pageJson = [
                "layout" => $html === false ? "" : $html,
                "css" => $css === false ? "" : $css,
                "name" => $key,
                "key" => $key,
                "events" => [
                    "ready" => $js
                ]
            ];
            $config['pages'][$key] = $pageJson;
        }
        $io->text("Compiling Providers");
        foreach ($pages->providers as $key){
            $js = $this->getFileContents("app/providers/$key.js");
            array_push($config['providers'], $js);
        }
        $io->text("Compiling Javascript Dependencies");
        foreach ($pages->dependencies->js as $key){
            $js = $this->getFileContents("app/dependencies/js/$key.js");
            array_push($config['dependencies']['js'], $js);
        }
        $io->text("Compiling CSS Dependencies");
        foreach ($pages->dependencies->css as $key){
            $js = $this->getFileContents("app/dependencies/css/$key.css");
            array_push($config['dependencies']['css'], $js);
        }
        $this->saveJSON($config, "build/formelo.manifest");
        $io->success(array("Build script has been completed.","Development server running on localhost:$portNumber"));
        return shell_exec("php -S localhost:$portNumber");
    }
    private function getJSON(){
        $filename = "app/pages/pages.json";
        $handle = fopen($filename, "r");
        $contents = fread($handle, filesize($filename));
        fclose($handle);
        return json_decode($contents);
    }
    private function getFileContents($filename){
        $handle = fopen($filename, "r") or die('Error opening '.$filename);
        $contents = fread($handle, filesize($filename)+1);
        fclose($handle);
        return $contents;
    }
    private function saveJSON($json, $filename = "app/pages/pages.json"){
        $handle = fopen($filename, "w");
        fwrite($handle, json_encode($json));
        fclose($handle);
    }
    private function str_random($length = 10) {
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $charactersLength = strlen($characters);
        $randomString = '';
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[rand(0, $charactersLength - 1)];
        }
        return $randomString;
    }
}

